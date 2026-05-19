import 'package:easy_localization/easy_localization.dart';

import 'package:mobile/shared/validation/field_limits.dart';

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
  if (v.length < FieldLimits.loginMin) {
    return 'validation.login_min'.tr();
  }
  if (v.length > FieldLimits.loginMax) {
    return 'validation.login_max'.tr();
  }
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
  final v = raw ?? '';
  if (v.length < FieldLimits.loginPasswordMin) {
    return 'validation.password_required'.tr();
  }
  if (v.length > FieldLimits.userPasswordMax) {
    return 'validation.password_register_max'.tr();
  }
  return null;
}

/// Имя при регистрации.
String? validateRegisterName(String? raw) {
  final v = raw?.trim() ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (v.length < FieldLimits.userDisplayNameMin) {
    return 'validation.name_register_min'.tr();
  }
  if (v.length > FieldLimits.userDisplayNameMax) {
    return 'validation.name_register_max'.tr();
  }
  return null;
}

String? validateRegisterEmail(String? raw) {
  final v = raw?.trim() ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (v.length > FieldLimits.emailMax) {
    return 'validation.email_max'.tr();
  }
  if (!emailFormatRe.hasMatch(v)) return 'validation.email_invalid'.tr();
  return null;
}

String? validateRegisterPhone(String? raw) {
  final v = raw?.trim() ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (v.length > FieldLimits.phoneMax) {
    return 'validation.phone_max'.tr();
  }
  if (!phoneE164Re.hasMatch(v)) return 'validation.phone_invalid'.tr();
  return null;
}

String? validateRegisterPassword(String? raw) {
  final v = raw ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (v.length < FieldLimits.userPasswordMin) {
    return 'validation.password_register_min'.tr();
  }
  if (v.length > FieldLimits.userPasswordMax) {
    return 'validation.password_register_max'.tr();
  }
  return null;
}

String? validateEmailCode(String? raw) {
  final s = raw?.trim() ?? '';
  if (s.isEmpty) return 'validation.required'.tr();
  if (s.length != FieldLimits.verifyEmailCodeLen) {
    return 'validation.code_length'.tr();
  }
  if (!RegExp(r'^\d{6}$').hasMatch(s)) {
    return 'validation.code_digits'.tr();
  }
  return null;
}

/// Имя в профиле.
String? validateProfileName(String? raw) {
  final v = raw?.trim() ?? '';
  if (v.isEmpty) return 'validation.required'.tr();
  if (v.length < FieldLimits.userDisplayNameMin) {
    return 'validation.name_register_min'.tr();
  }
  if (v.length > FieldLimits.userDisplayNameMax) {
    return 'validation.name_register_max'.tr();
  }
  return null;
}
