import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';

import '../../../app/router/app_routes.dart';
import '../../../shared/validation/field_limits.dart';
import '../../../shared/validation/input_validators.dart';
import '../../../shared/widgets/password_text_field.dart';
import '../../profile/cubit/profile_cubit.dart';
import '../cubit/auth_cubit.dart';
import '../cubit/auth_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _loginCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  @override
  void dispose() {
    _loginCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthCubit, AuthState>(
      listenWhen: (p, n) => n is AuthAuthorized || n is AuthError,
      listener: (context, state) {
        if (state is AuthAuthorized) {
          // ignore: discarded_futures
          context.read<ProfileCubit>().load();
          context.go(AppRoutes.map);
        }
        if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text('auth.login'.tr()),
          actions: [
            IconButton(
              tooltip: 'support.title'.tr(),
              icon: const Icon(Icons.help_outline),
              onPressed: () => context.push(AppRoutes.support),
            ),
          ],
        ),
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
                    controller: _loginCtrl,
                    decoration: InputDecoration(
                      labelText: 'auth.email_or_phone'.tr(),
                      helperText: 'auth.login_hint'.tr(),
                      helperMaxLines: 2,
                    ),
                    maxLength: FieldLimits.loginMax,
                    textInputAction: TextInputAction.next,
                    validator: validateLogin,
                  ),
                  const Gap(12),
                  PasswordTextField(
                    controller: _passwordCtrl,
                    labelText: 'auth.password'.tr(),
                    maxLength: FieldLimits.userPasswordMax,
                    textInputAction: TextInputAction.done,
                    validator: validatePasswordLogin,
                  ),
                  const Gap(16),
                  BlocBuilder<AuthCubit, AuthState>(
                    builder: (context, state) {
                      final loading = state is AuthLoading;
                      return FilledButton(
                        onPressed: loading
                            ? null
                            : () {
                                if (!_formKey.currentState!.validate()) return;
                                context.read<AuthCubit>().login(
                                      login: _loginCtrl.text.trim(),
                                      password: _passwordCtrl.text,
                                    );
                              },
                        child: loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Text('auth.login'.tr()),
                      );
                    },
                  ),
                  const Gap(12),
                  TextButton(
                    onPressed: () => context.go(AppRoutes.register),
                    child: Text('auth.no_account'.tr()),
                  ),
                  TextButton(
                    onPressed: () => context.push(AppRoutes.support),
                    child: Text('auth.help'.tr()),
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
