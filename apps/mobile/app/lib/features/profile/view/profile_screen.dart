import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';

import '../../../app/router/app_routes.dart';
import '../cubit/profile_cubit.dart';
import '../cubit/profile_state.dart';
import '../domain/profile_user.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameCtrl = TextEditingController();
  String? _filledForUserId;

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  void _ensureFilled(ProfileUser user) {
    if (_filledForUserId == user.id) return;
    _filledForUserId = user.id;
    _nameCtrl.text = user.name;
  }

  void _onSave(BuildContext context) {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) return;
    context.read<ProfileCubit>().updateName(name);
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProfileCubit, ProfileState>(
      listenWhen: (p, n) => n is ProfileUpdated || n is ProfileUpdateError,
      listener: (context, state) {
        final messenger = ScaffoldMessenger.of(context);
        if (state is ProfileUpdated) {
          _filledForUserId = state.user.id;
          _nameCtrl.text = state.user.name;
          messenger.showSnackBar(
            SnackBar(content: Text('profile.name_updated'.tr())),
          );
        }
        if (state is ProfileUpdateError) {
          messenger.showSnackBar(
            SnackBar(content: Text('profile.name_update_failed'.tr())),
          );
        }
      },
      builder: (context, state) {
        final isLoading = state is ProfileLoading || state is ProfileInitial;
        final user = switch (state) {
          ProfileLoaded(:final user) => user,
          ProfileUpdated(:final user) => user,
          ProfileUpdateError(:final user) => user,
          _ => null,
        };
        if (user != null) {
          _ensureFilled(user);
        }

        return Scaffold(
          appBar: AppBar(
            title: Text('profile.title'.tr()),
            leading: BackButton(onPressed: () => context.pop()),
          ),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (isLoading) ...[
                    const LinearProgressIndicator(),
                    const Gap(16),
                  ],
                  if (state is ProfileLoadError) ...[
                    Text(
                      state.message,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                    const Gap(8),
                    OutlinedButton.icon(
                      onPressed: () => context.read<ProfileCubit>().load(),
                      icon: const Icon(Icons.refresh),
                      label: Text('common.continue'.tr()),
                    ),
                    const Gap(16),
                  ],
                  TextField(
                    controller: _nameCtrl,
                    enabled: user != null && !isLoading,
                    decoration: InputDecoration(
                      labelText: 'auth.name'.tr(),
                      hintText: 'profile.update_name_hint'.tr(),
                    ),
                  ),
                  const Gap(12),
                  FilledButton(
                    onPressed: (user == null || isLoading)
                        ? null
                        : () => _onSave(context),
                    child: Text('common.save'.tr()),
                  ),
                  const Gap(24),
                  FilledButton(
                    onPressed: () => context.push(AppRoutes.settings),
                    child: Text('profile.settings'.tr()),
                  ),
                  const Gap(12),
                  FilledButton.tonal(
                    onPressed: () => context.push(AppRoutes.support),
                    child: Text('profile.support'.tr()),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
