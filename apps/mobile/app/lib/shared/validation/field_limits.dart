/// Sync with @carsharing/validation (packages/validation).
abstract final class FieldLimits {
  static const int nonEmptyStringMin = 1;
  static const int userDisplayNameMin = 3;
  static const int userDisplayNameMax = 120;
  static const int userPasswordMin = 8;
  static const int userPasswordMax = 255;
  static const int loginMin = 3;
  static const int loginMax = 200;
  static const int loginPasswordMin = 1;
  static const int emailMax = 254;
  static const int phoneMax = 16;
  static const int verifyEmailCodeLen = 6;
}
