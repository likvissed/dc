User.destroy_all
Role.destroy_all

Role.create(name: 'admin')
Role.create(name: 'manage_serv')

user = User.create(username: 'admin', password: 'admin')
user.add_role :admin

user = User.create(username: 'test', password: 'test')
user.add_role :manage_serv

ServerStatus.create([
  { name: "В работе" },
  { name: "Тест" },
  { name: "Простой" },
])