import 'package:easy_localization/easy_localization.dart';

/// Email и телефон E.164 в том же виде, что ожидает бэкенд (`RegisterDto` / `LoginDto`).
final RegExp emailFormatRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
final RegExp phoneE164Re = RegExp(r'^\+[1-9]\d{1,14}$');

String? validateRequiredTrim(String? raw) {
  if (raw == null || raw.trim().isEmpty) {
    return 'validation.required'.tr();
  }
  return null;
}

/// Логин: email или телефон E.164 (как `LoginDto` на бэкенде).
String? validateLogin(String? raw) {
  final v = raw?.trim() ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (v.length < 3) return 'validation.login_min'.tr();
  if (v.contains('@')) {
    if (!emailFormatRe.hasMatch(v)) return 'validation.email_invalid'.tr();
    return null;
  }
  if (v.startsWith('+')) {
    if (!phoneE164Re.hasMatch(v)) return 'validation.phone_invalid'.tr();
    return null;
  }
  return 'validation.login_format'.tr();
}

String? validatePasswordLogin(String? raw) {
  if (raw == null || raw.isEmpty) return 'validation.password_required'.tr();
  return null;
}

/// Имя при регистрации: 3–255 символов.
String? validateRegisterName(String? raw) {
  final v = raw?.trim() ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (v.length < 3) return 'validation.name_register_min'.tr();
  if (v.length > 255) return 'validation.name_register_max'.tr();
  return null;
}

String? validateRegisterEmail(String? raw) {
  final v = raw?.trim() ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (!emailFormatRe.hasMatch(v)) return 'validation.email_invalid'.tr();
  return null;
}

String? validateRegisterPhone(String? raw) {
  final v = raw?.trim() ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (!phoneE164Re.hasMatch(v)) return 'validation.phone_invalid'.tr();
  return null;
}

String? validateRegisterPassword(String? raw) {
  final v = raw ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (v.length < 8) return 'validation.password_register_min'.tr();
  if (v.length > 255) return 'validation.password_register_max'.tr();
  return null;
}

String? validateEmailCode(String? raw) {
  final s = raw?.trim() ?? '';
  if (s.isEmpty) return 'validation.required'.tr();
  if (s.length != 6) return 'validation.code_length'.tr();
  if (!RegExp(r'^\d{6}$').hasMatch(s)) {
    return 'validation.code_digits'.tr();
  }
  return null;
}

/// Имя в профиле: не пустое после trim, разумный максимум.
String? validateProfileName(String? raw) {
  final v = raw?.trim() ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (v.length > 255) return 'validation.name_register_max'.tr();
  return null;
}
