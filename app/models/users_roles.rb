class UsersRoles < ActiveRecord::Base

  # Удалить указанную связку Пользователь - Роль
  def self.delete_role(subject, role_symbol, obj = nil)
    res_name  = obj.nil? ? nil : obj.class.name
    res_id    = obj.id rescue nil

    role = subject.roles.where(name: role_symbol.to_s, resource_type: res_name, resource_id: res_id).first
    if role.nil?
      raise "cannot delete nonexisting role on subject"
    end

    self.delete(user_id: subject.id, role_id: role.id)
  end

end