import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';

import '../../../app/router/app_routes.dart';
import '../../../shared/validation/input_validators.dart';
import '../../../shared/widgets/password_text_field.dart';
import '../cubit/auth_cubit.dart';
import '../cubit/auth_state.dart';
import '../domain/auth_result.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  String? _emailServerError;
  String? _phoneServerError;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _clearServerErrors() {
    if (_emailServerError == null && _phoneServerError == null) return;
    setState(() {
      _emailServerError = null;
      _phoneServerError = null;
    });
  }

  void _applyServerError(String message) {
    final lower = message.toLowerCase();
    if (lower.contains('телефон') || lower.contains('phone')) {
      setState(() {
        _phoneServerError = message;
        _emailServerError = null;
      });
      return;
    }
    if (lower.contains('email')) {
      setState(() {
        _emailServerError = message;
        _phoneServerError = null;
      });
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthCubit, AuthState>(
      listenWhen: (p, n) => n is AuthAuthorized || n is AuthError,
      listener: (context, state) {
        if (state is AuthAuthorized) {
          context.go(AppRoutes.map);
        }
        if (state is AuthError) {
          _applyServerError(state.message);
        }
      },
      child: Scaffold(
        appBar: AppBar(title: Text('auth.register'.tr())),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              autovalidateMode: AutovalidateMode.onUserInteraction,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _nameCtrl,
                    decoration: InputDecoration(labelText: 'auth.name'.tr()),
                    textInputAction: TextInputAction.next,
                    onChanged: (_) => _clearServerErrors(),
                    validator: validateRegisterName,
                  ),
                  const Gap(12),
                  TextFormField(
                    controller: _emailCtrl,
                    decoration: InputDecoration(
                      labelText: 'auth.email'.tr(),
                      errorText: _emailServerError,
                    ),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autocorrect: false,
                    onChanged: (_) => _clearServerErrors(),
                    validator: (v) {
                      if (_emailServerError != null) return _emailServerError;
                      return validateRegisterEmail(v);
                    },
                  ),
                  const Gap(12),
                  TextFormField(
                    controller: _phoneCtrl,
                    decoration: InputDecoration(
                      labelText: 'auth.phone'.tr(),
                      helperText: 'auth.phone_hint'.tr(),
                      helperMaxLines: 2,
                      errorText: _phoneServerError,
                    ),
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    autocorrect: false,
                    onChanged: (_) => _clearServerErrors(),
                    validator: (v) {
                      if (_phoneServerError != null) return _phoneServerError;
                      return validateRegisterPhone(v);
                    },
                  ),
                  const Gap(12),
                  PasswordTextField(
                    controller: _passwordCtrl,
                    labelText: 'auth.password'.tr(),
                    helperText: 'auth.password_rules'.tr(),
                    helperMaxLines: 2,
                    textInputAction: TextInputAction.done,
                    validator: validateRegisterPassword,
                  ),
                  const Gap(16),
                  BlocBuilder<AuthCubit, AuthState>(
                    builder: (context, state) {
                      final loading = state is AuthLoading;
                      return FilledButton(
                        onPressed: loading
                            ? null
                            : () async {
                                _clearServerErrors();
                                if (!_formKey.currentState!.validate()) return;
                                final cubit = context.read<AuthCubit>();
                                final res = await cubit.register(
                                  name: _nameCtrl.text.trim(),
                                  email: _emailCtrl.text.trim(),
                                  phone: _phoneCtrl.text.trim(),
                                  password: _passwordCtrl.text,
                                );

                                if (!context.mounted) return;
                                if (res is AuthRequiresVerification) {
                                  context.go(
                                    '${AppRoutes.verifyEmail}?email=${Uri.encodeComponent(res.email)}',
                                  );
                                  if (res.message.isNotEmpty) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(res.message)),
                                    );
                                  }
                                }
                              },
                        child: loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Text('auth.register'.tr()),
                      );
                    },
                  ),
                  const Gap(12),
                  TextButton(
                    onPressed: () => context.go(AppRoutes.login),
                    child: Text('auth.have_account'.tr()),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
