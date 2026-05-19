import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class PasswordTextField extends StatefulWidget {
  const PasswordTextField({
    super.key,
    required this.controller,
    this.validator,
    this.labelText,
    this.helperText,
    this.helperMaxLines = 1,
    this.maxLength,
    this.textInputAction,
    this.onFieldSubmitted,
  });

  final TextEditingController controller;
  final FormFieldValidator<String>? validator;
  final String? labelText;
  final String? helperText;
  final int helperMaxLines;
  final int? maxLength;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onFieldSubmitted;

  @override
  State<PasswordTextField> createState() => _PasswordTextFieldState();
}

class _PasswordTextFieldState extends State<PasswordTextField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: _obscure,
      maxLength: widget.maxLength,
      validator: widget.validator,
      textInputAction: widget.textInputAction,
      onFieldSubmitted: widget.onFieldSubmitted,
      decoration: InputDecoration(
        labelText: widget.labelText,
        helperText: widget.helperText,
        helperMaxLines: widget.helperMaxLines,
        suffixIcon: IconButton(
          tooltip: _obscure ? 'auth.show_password'.tr() : 'auth.hide_password'.tr(),
          onPressed: () => setState(() => _obscure = !_obscure),
          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
        ),
      ),
    );
  }
}
