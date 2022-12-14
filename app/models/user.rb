class User < ActiveRecord::Base

  ROLES = ["admin", "uivt", "not_uivt", "head"].freeze

  after_validation :get_user_iss_data
  rolify before_add: :delete_roles

  devise :database_authenticatable, :trackable

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :tn, uniqueness: true, presence: true, numericality: { greater_than: 0 }
  # validates :password, confirmation: true

  attr_accessor :login
  attr_accessor :division

  def self.find_for_database_authentication(warden_conditions)
    conditions = warden_conditions.dup
    if login = conditions.delete(:login)
      where(conditions.to_hash).where(["tn = :value", { :value => login }]).first
    elsif conditions.has_key?(:tn)
      where(conditions.to_hash).first
    end
  end

  protected

  def password_required?
    false
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

  # Получить ФИО пользователя из БД Штатной расстановки
  def get_user_iss_data
    @user = UsersReference.user_find_by_tn(self.tn)

    if @user.blank?
      self.errors.add(:tn, "Информация по указанному табельному не найдена")
      return
    end

    self.info = @user['fullName']
  end

end