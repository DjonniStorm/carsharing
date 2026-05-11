import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';

import '../../../app/router/app_routes.dart';
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
          context.go(AppRoutes.map);
        }
        if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(title: Text('auth.login'.tr())),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _loginCtrl,
                    decoration: InputDecoration(
                      labelText: 'auth.email_or_phone'.tr(),
                    ),
                    textInputAction: TextInputAction.next,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'required' : null,
                  ),
                  const Gap(12),
                  TextFormField(
                    controller: _passwordCtrl,
                    decoration:
                        InputDecoration(labelText: 'auth.password'.tr()),
                    obscureText: true,
                    textInputAction: TextInputAction.done,
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'required' : null,
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
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

