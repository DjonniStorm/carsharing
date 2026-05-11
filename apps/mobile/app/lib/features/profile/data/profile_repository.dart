import '../domain/profile_user.dart';
import 'profile_api.dart';

class ProfileRepository {
  ProfileRepository(this._api);

  final ProfileApi _api;

  Future<ProfileUser> me() async {
    final data = await _api.me();
    return ProfileUser.fromJson(data);
  }

  Future<ProfileUser> updateName({
    required String id,
    required String name,
  }) async {
    final data = await _api.patchUser(id: id, data: {'name': name});
    return ProfileUser.fromJson(data);
  }
}

