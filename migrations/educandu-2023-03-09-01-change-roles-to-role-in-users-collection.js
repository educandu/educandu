export const ROLE_HIERATCHY = {
  admin: 'admin',
  maintainer: 'maintainer',
  accreditedAuthor: 'accredited-author',
  user: 'user'
};

function getHighestRoleFromRoles(roles) {
  return Object.values(ROLE_HIERATCHY).find(role => roles.includes(role)) || ROLE_HIERATCHY.user;
}

export default class Educandu_2023_03_09_01_change_roles_to_role_in_users_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const cursor = this.db.collection('users').find({});

    while (await cursor.hasNext()) {
      const user = await cursor.next();

      user.role = getHighestRoleFromRoles(user.roles);

      console.log(`Migrating roles of user '${user._id}' from [${user.roles}] to '${user.role}'`);

      delete user.roles;
      await this.db.collection('users').replaceOne({ _id: user._id }, user);
    }
  }

  async down() {
    const cursor = this.db.collection('users').find({});

    while (await cursor.hasNext()) {
      const user = await cursor.next();

      user.roles = [user.role];
      delete user.role;

      console.log(`Migrating role of user '${user._id}' from '${user.role}' to [${user.roles}]`);
      await this.db.collection('users').replaceOne({ _id: user._id }, user);
    }
  }
}
