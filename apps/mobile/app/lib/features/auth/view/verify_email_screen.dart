import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_routes.dart';
import '../cubit/auth_cubit.dart';
import '../cubit/auth_state.dart';

class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key, required this.email});

  final String email;

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeCtrl = TextEditingController();

  @override
  void dispose() {
    _codeCtrl.dispose();
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
        appBar: AppBar(title: Text('auth.verify_email'.tr())),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(widget.email, style: Theme.of(context).textTheme.bodyLarge),
                  const Gap(12),
                  TextFormField(
                    controller: _codeCtrl,
                    decoration: InputDecoration(labelText: 'auth.code'.tr()),
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    validator: (v) {
                      final s = v?.trim() ?? '';
                      if (s.length != 6) return 'required';
                      final ok = RegExp(r'^\d{6}$').hasMatch(s);
                      return ok ? null : 'invalid';
                    },
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
                                context.read<AuthCubit>().verifyEmail(
                                      email: widget.email,
                                      code: _codeCtrl.text.trim(),
                                    );
                              },
                        child: loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Text('common.continue'.tr()),
                      );
                    },
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

