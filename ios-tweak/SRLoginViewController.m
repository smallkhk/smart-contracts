#import "SRLoginViewController.h"

static NSString *const kActivated = @"SilkRoadActivated";
static NSString *const kServerURL = @"http://54.241.57.251:4000/validate";

@interface SRLoginViewController () <UITextFieldDelegate>
@property (nonatomic, strong) UITextField             *keyField;
@property (nonatomic, strong) UIButton                *activateBtn;
@property (nonatomic, strong) UILabel                 *errorLabel;
@property (nonatomic, strong) UIActivityIndicatorView *spinner;
@end

@implementation SRLoginViewController

+ (void)presentIfNeeded {
    if ([[NSUserDefaults standardUserDefaults] boolForKey:kActivated]) return;

    UIWindow *win = nil;
    if (@available(iOS 13.0, *)) {
        for (UIWindowScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if (scene.activationState == UISceneActivationStateForegroundActive) {
                win = scene.windows.firstObject;
                break;
            }
        }
    }
    if (!win) win = [UIApplication sharedApplication].keyWindow;
    if (!win) return;

    SRLoginViewController *vc = [[SRLoginViewController alloc] init];
    vc.modalPresentationStyle = UIModalPresentationOverFullScreen;
    vc.modalTransitionStyle   = UIModalTransitionStyleCrossDissolve;
    [win.rootViewController presentViewController:vc animated:YES completion:nil];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    [self buildUI];
}

- (void)buildUI {
    self.view.backgroundColor = [UIColor colorWithRed:0.04 green:0.04 blue:0.04 alpha:1.0];

    // ── Card ──────────────────────────────────────────────────────────────────
    UIView *card = [[UIView alloc] init];
    card.backgroundColor      = [UIColor colorWithRed:0.09 green:0.09 blue:0.09 alpha:1.0];
    card.layer.cornerRadius   = 20;
    card.layer.borderWidth    = 0.5;
    card.layer.borderColor    = [UIColor colorWithWhite:0.22 alpha:1.0].CGColor;
    card.translatesAutoresizingMaskIntoConstraints = NO;
    [self.view addSubview:card];

    // ── Lock icon ─────────────────────────────────────────────────────────────
    UILabel *icon = [[UILabel alloc] init];
    icon.text          = @"🔐";
    icon.font          = [UIFont systemFontOfSize:52];
    icon.textAlignment = NSTextAlignmentCenter;
    icon.translatesAutoresizingMaskIntoConstraints = NO;
    [card addSubview:icon];

    // ── Title ─────────────────────────────────────────────────────────────────
    UILabel *title = [[UILabel alloc] init];
    title.text          = @"SILK ROAD";
    title.font          = [UIFont systemFontOfSize:30 weight:UIFontWeightBold];
    title.textColor     = [UIColor whiteColor];
    title.textAlignment = NSTextAlignmentCenter;
    title.translatesAutoresizingMaskIntoConstraints = NO;
    [card addSubview:title];

    // ── Subtitle ──────────────────────────────────────────────────────────────
    UILabel *sub = [[UILabel alloc] init];
    sub.text          = @"Enter your license key to continue";
    sub.font          = [UIFont systemFontOfSize:14 weight:UIFontWeightRegular];
    sub.textColor     = [UIColor colorWithWhite:0.45 alpha:1.0];
    sub.textAlignment = NSTextAlignmentCenter;
    sub.translatesAutoresizingMaskIntoConstraints = NO;
    [card addSubview:sub];

    // ── Divider ───────────────────────────────────────────────────────────────
    UIView *divider = [[UIView alloc] init];
    divider.backgroundColor = [UIColor colorWithWhite:0.18 alpha:1.0];
    divider.translatesAutoresizingMaskIntoConstraints = NO;
    [card addSubview:divider];

    // ── Key field ─────────────────────────────────────────────────────────────
    self.keyField = [[UITextField alloc] init];
    self.keyField.attributedPlaceholder = [[NSAttributedString alloc]
        initWithString:@"ECLPS-XXXXX-XXXXX-XXXXX"
        attributes:@{NSForegroundColorAttributeName: [UIColor colorWithWhite:0.28 alpha:1.0]}];
    self.keyField.font                  = [UIFont monospacedSystemFontOfSize:17 weight:UIFontWeightMedium];
    self.keyField.textColor             = [UIColor whiteColor];
    self.keyField.textAlignment         = NSTextAlignmentCenter;
    self.keyField.autocapitalizationType = UITextAutocapitalizationTypeAllCharacters;
    self.keyField.autocorrectionType    = UITextAutocorrectionTypeNo;
    self.keyField.spellCheckingType     = UITextSpellCheckingTypeNo;
    self.keyField.backgroundColor       = [UIColor colorWithRed:0.13 green:0.13 blue:0.13 alpha:1.0];
    self.keyField.layer.cornerRadius    = 12;
    self.keyField.layer.borderWidth     = 1;
    self.keyField.layer.borderColor     = [UIColor colorWithWhite:0.24 alpha:1.0].CGColor;
    self.keyField.returnKeyType         = UIReturnKeyDone;
    self.keyField.keyboardAppearance    = UIKeyboardAppearanceDark;
    self.keyField.delegate              = self;
    self.keyField.translatesAutoresizingMaskIntoConstraints = NO;

    UIView *lp = [[UIView alloc] initWithFrame:CGRectMake(0,0,16,1)];
    UIView *rp = [[UIView alloc] initWithFrame:CGRectMake(0,0,16,1)];
    self.keyField.leftView      = lp;  self.keyField.leftViewMode  = UITextFieldViewModeAlways;
    self.keyField.rightView     = rp;  self.keyField.rightViewMode = UITextFieldViewModeAlways;
    [card addSubview:self.keyField];

    // ── Activate button ───────────────────────────────────────────────────────
    self.activateBtn = [UIButton buttonWithType:UIButtonTypeSystem];
    [self.activateBtn setTitle:@"ACTIVATE" forState:UIControlStateNormal];
    self.activateBtn.titleLabel.font = [UIFont systemFontOfSize:16 weight:UIFontWeightBold];
    [self.activateBtn setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    self.activateBtn.backgroundColor      = [UIColor whiteColor];
    self.activateBtn.layer.cornerRadius   = 12;
    self.activateBtn.translatesAutoresizingMaskIntoConstraints = NO;
    [self.activateBtn addTarget:self action:@selector(activateTapped)
               forControlEvents:UIControlEventTouchUpInside];
    [card addSubview:self.activateBtn];

    // ── Error label ───────────────────────────────────────────────────────────
    self.errorLabel = [[UILabel alloc] init];
    self.errorLabel.font          = [UIFont systemFontOfSize:13];
    self.errorLabel.textColor     = [UIColor colorWithRed:1.0 green:0.3 blue:0.3 alpha:1.0];
    self.errorLabel.textAlignment = NSTextAlignmentCenter;
    self.errorLabel.numberOfLines = 0;
    self.errorLabel.translatesAutoresizingMaskIntoConstraints = NO;
    [card addSubview:self.errorLabel];

    // ── Spinner ───────────────────────────────────────────────────────────────
    self.spinner = [[UIActivityIndicatorView alloc]
        initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleMedium];
    self.spinner.color              = [UIColor whiteColor];
    self.spinner.hidesWhenStopped   = YES;
    self.spinner.translatesAutoresizingMaskIntoConstraints = NO;
    [card addSubview:self.spinner];

    // ── Layout ────────────────────────────────────────────────────────────────
    [NSLayoutConstraint activateConstraints:@[
        [card.centerXAnchor constraintEqualToAnchor:self.view.centerXAnchor],
        [card.centerYAnchor constraintEqualToAnchor:self.view.centerYAnchor],
        [card.widthAnchor   constraintEqualToConstant:320],

        [icon.topAnchor      constraintEqualToAnchor:card.topAnchor constant:36],
        [icon.centerXAnchor  constraintEqualToAnchor:card.centerXAnchor],

        [title.topAnchor     constraintEqualToAnchor:icon.bottomAnchor constant:14],
        [title.leadingAnchor constraintEqualToAnchor:card.leadingAnchor constant:24],
        [title.trailingAnchor constraintEqualToAnchor:card.trailingAnchor constant:-24],

        [sub.topAnchor       constraintEqualToAnchor:title.bottomAnchor constant:8],
        [sub.leadingAnchor   constraintEqualToAnchor:card.leadingAnchor constant:24],
        [sub.trailingAnchor  constraintEqualToAnchor:card.trailingAnchor constant:-24],

        [divider.topAnchor    constraintEqualToAnchor:sub.bottomAnchor constant:24],
        [divider.leadingAnchor constraintEqualToAnchor:card.leadingAnchor],
        [divider.trailingAnchor constraintEqualToAnchor:card.trailingAnchor],
        [divider.heightAnchor constraintEqualToConstant:0.5],

        [self.keyField.topAnchor     constraintEqualToAnchor:divider.bottomAnchor constant:24],
        [self.keyField.leadingAnchor  constraintEqualToAnchor:card.leadingAnchor constant:24],
        [self.keyField.trailingAnchor constraintEqualToAnchor:card.trailingAnchor constant:-24],
        [self.keyField.heightAnchor  constraintEqualToConstant:52],

        [self.activateBtn.topAnchor     constraintEqualToAnchor:self.keyField.bottomAnchor constant:14],
        [self.activateBtn.leadingAnchor  constraintEqualToAnchor:card.leadingAnchor constant:24],
        [self.activateBtn.trailingAnchor constraintEqualToAnchor:card.trailingAnchor constant:-24],
        [self.activateBtn.heightAnchor  constraintEqualToConstant:52],

        [self.errorLabel.topAnchor      constraintEqualToAnchor:self.activateBtn.bottomAnchor constant:12],
        [self.errorLabel.leadingAnchor   constraintEqualToAnchor:card.leadingAnchor constant:24],
        [self.errorLabel.trailingAnchor  constraintEqualToAnchor:card.trailingAnchor constant:-24],

        [self.spinner.topAnchor     constraintEqualToAnchor:self.errorLabel.bottomAnchor constant:10],
        [self.spinner.centerXAnchor constraintEqualToAnchor:card.centerXAnchor],
        [self.spinner.bottomAnchor  constraintEqualToAnchor:card.bottomAnchor constant:-32],
    ]];
}

// ── Actions ───────────────────────────────────────────────────────────────────

- (void)activateTapped {
    NSString *key = [self.keyField.text
        stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]]
        .uppercaseString;

    if (key.length == 0) { [self showError:@"Please enter your license key"]; return; }

    [self setLoading:YES];
    [self validateKey:key completion:^(BOOL valid, NSString *reason) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [self setLoading:NO];
            if (valid) {
                [[NSUserDefaults standardUserDefaults] setBool:YES forKey:kActivated];
                [[NSUserDefaults standardUserDefaults] synchronize];
                [self dismissViewControllerAnimated:YES completion:nil];
            } else {
                [self showError:reason ?: @"Invalid license key"];
            }
        });
    }];
}

- (void)validateKey:(NSString *)key completion:(void(^)(BOOL, NSString *))cb {
    NSURL *url = [NSURL URLWithString:kServerURL];
    NSMutableURLRequest *req = [NSMutableURLRequest requestWithURL:url
                                                       cachePolicy:NSURLRequestReloadIgnoringCacheData
                                                   timeoutInterval:10];
    req.HTTPMethod = @"POST";
    [req setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    req.HTTPBody = [NSJSONSerialization dataWithJSONObject:@{@"key": key} options:0 error:nil];

    [[[NSURLSession sharedSession] dataTaskWithRequest:req
        completionHandler:^(NSData *data, NSURLResponse *resp, NSError *err) {
            if (err || !data) { cb(NO, @"Cannot reach server. Check your connection."); return; }
            NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
            cb([json[@"valid"] boolValue], json[@"reason"]);
    }] resume];
}

- (void)showError:(NSString *)msg {
    self.errorLabel.text = msg;
    [UIView animateWithDuration:0.08 animations:^{
        self.activateBtn.transform = CGAffineTransformMakeTranslation(-10, 0);
    } completion:^(BOOL _){
        [UIView animateWithDuration:0.08 animations:^{
            self.activateBtn.transform = CGAffineTransformMakeTranslation(10, 0);
        } completion:^(BOOL _){
            [UIView animateWithDuration:0.08 animations:^{
                self.activateBtn.transform = CGAffineTransformIdentity;
            }];
        }];
    }];
}

- (void)setLoading:(BOOL)loading {
    self.keyField.enabled    = !loading;
    self.activateBtn.enabled = !loading;
    [self.activateBtn setTitle:loading ? @"" : @"ACTIVATE" forState:UIControlStateNormal];
    loading ? [self.spinner startAnimating] : [self.spinner stopAnimating];
}

- (BOOL)textFieldShouldReturn:(UITextField *)tf {
    [self activateTapped]; return YES;
}

// Block dismiss by swipe / back button
- (BOOL)shouldAutorotate { return YES; }

@end
