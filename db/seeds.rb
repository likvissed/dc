User.destroy_all
Role.destroy_all

Role.create(
  [
    { name: 'admin' },
    { name: 'uivt' },
    { name: 'not_uivt' },
    { name: 'head' },
  ]
)

user = User.create(tn: ***REMOVED***)
user.add_role :admin