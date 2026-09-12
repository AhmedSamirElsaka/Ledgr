#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
#import <PhotosUI/PhotosUI.h>

@interface LedgrReceiptPicker : NSObject <RCTBridgeModule, PHPickerViewControllerDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate>
@property (nonatomic, copy) RCTPromiseResolveBlock resolve;
@property (nonatomic, copy) RCTPromiseRejectBlock reject;
@end

@implementation LedgrReceiptPicker

RCT_EXPORT_MODULE(LedgrReceiptPicker);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_METHOD(pickImage:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (self.resolve != nil) {
    reject(@"RECEIPT_PICK_IN_PROGRESS", @"A pick is already in progress", nil);
    return;
  }

  self.resolve = resolve;
  self.reject = reject;

  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *root = RCTPresentedViewController();
    if (root == nil) {
      if (self.reject) {
        self.reject(@"RECEIPT_PICK_UNAVAILABLE", @"No view controller", nil);
      }
      self.resolve = nil;
      self.reject = nil;
      return;
    }

    if (@available(iOS 14, *)) {
      PHPickerConfiguration *config = [[PHPickerConfiguration alloc] init];
      config.filter = [PHPickerFilter imagesFilter];
      config.selectionLimit = 1;
      PHPickerViewController *picker = [[PHPickerViewController alloc] initWithConfiguration:config];
      picker.delegate = self;
      [root presentViewController:picker animated:YES completion:nil];
      return;
    }

    UIImagePickerController *picker = [[UIImagePickerController alloc] init];
    picker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
    picker.delegate = self;
    [root presentViewController:picker animated:YES completion:nil];
  });
}

- (void)finishWithURI:(NSString *)uri mimeType:(NSString *)mimeType
{
  if (self.resolve) {
    self.resolve(@{@"uri": uri, @"mimeType": mimeType ?: [NSNull null]});
  }
  self.resolve = nil;
  self.reject = nil;
}

- (void)finishCancelled
{
  if (self.resolve) {
    self.resolve([NSNull null]);
  }
  self.resolve = nil;
  self.reject = nil;
}

- (void)finishWithError:(NSString *)message
{
  if (self.reject) {
    self.reject(@"RECEIPT_PICK_FAILED", message, nil);
  }
  self.resolve = nil;
  self.reject = nil;
}

- (NSURL *)writeJPEG:(UIImage *)image
{
  NSData *data = UIImageJPEGRepresentation(image, 0.9);
  if (data == nil) {
    return nil;
  }
  NSString *name = [NSString stringWithFormat:@"pick-%.0f.jpg", [[NSDate date] timeIntervalSince1970] * 1000];
  NSURL *url = [NSURL fileURLWithPath:[NSTemporaryDirectory() stringByAppendingPathComponent:name]];
  if (![data writeToURL:url atomically:YES]) {
    return nil;
  }
  return url;
}

#pragma mark - PHPickerViewControllerDelegate

- (void)picker:(PHPickerViewController *)picker didFinishPicking:(NSArray<PHPickerResult *> *)results API_AVAILABLE(ios(14))
{
  [picker dismissViewControllerAnimated:YES completion:nil];
  PHPickerResult *result = results.firstObject;
  if (result == nil) {
    [self finishCancelled];
    return;
  }

  NSItemProvider *provider = result.itemProvider;
  if (![provider canLoadObjectOfClass:[UIImage class]]) {
    [self finishWithError:@"Selected item is not an image"];
    return;
  }

  [provider loadObjectOfClass:[UIImage class]
            completionHandler:^(__kindof id<NSItemProviderReading>  _Nullable object, NSError * _Nullable error) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (error != nil || ![object isKindOfClass:[UIImage class]]) {
        [self finishWithError:error.localizedDescription ?: @"Could not load image"];
        return;
      }
      NSURL *url = [self writeJPEG:(UIImage *)object];
      if (url == nil) {
        [self finishWithError:@"Could not save picked image"];
        return;
      }
      [self finishWithURI:url.absoluteString mimeType:@"image/jpeg"];
    });
  }];
}

#pragma mark - UIImagePickerControllerDelegate

- (void)imagePickerController:(UIImagePickerController *)picker
didFinishPickingMediaWithInfo:(NSDictionary<UIImagePickerControllerInfoKey,id> *)info
{
  [picker dismissViewControllerAnimated:YES completion:nil];
  UIImage *image = info[UIImagePickerControllerOriginalImage];
  if (image == nil) {
    [self finishCancelled];
    return;
  }
  NSURL *url = [self writeJPEG:image];
  if (url == nil) {
    [self finishWithError:@"Could not save picked image"];
    return;
  }
  [self finishWithURI:url.absoluteString mimeType:@"image/jpeg"];
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
  [picker dismissViewControllerAnimated:YES completion:nil];
  [self finishCancelled];
}

@end
