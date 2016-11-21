class User < ActiveRecord::Base

  ROLES = ["admin", "uivt", "not_uivt", "head"].freeze

  rolify before_add: :delete_roles
  # :confirmable, :lockable, :timeoutable, :omniauthable and :registerable
  devise :database_authenticatable, :trackable, authentication_keys: [:login]

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :username, uniqueness: { case_sensitive: false }, format: { with: /\w+/, message: "Разрешены только английские символы, цифры и знак '_'" }
  validates :password, confirmation: true

  attr_accessor :login

  def self.find_for_database_authentication(warden_conditions)
    conditions = warden_conditions.dup
    if login = conditions.delete(:login)
      where(conditions.to_hash).where(["username = :value", { :value => login }]).first
    elsif conditions.has_key?(:username)
      where(conditions.to_hash).first
    end
  end

  def email_required?
    false
  end

  def email_changed?
    false
  end

  private

  # Удалить все роли пользователя перед добавлением новой
  # Это обеспечит структуру, при которой каждому пользователю будет присвоена только одна роль
  def delete_roles(role)
    ROLES.each do |role|
      begin
        delete_role role
      rescue RuntimeError
        "Роль не найдена"
      end

    end
  end

  # Удалить указанную связку Пользователь - Роль
  def delete_role(role_symbol, target = nil)
    UsersRoles.delete_role self, role_symbol, target
  end

end