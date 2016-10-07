User.destroy_all
Role.destroy_all

Role.create(name: 'admin')
Role.create(name: 'manage_serv')

user = User.create(username: 'admin', password: 'admin')
user.add_role :admin