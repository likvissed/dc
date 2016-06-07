class User < ActiveRecord::Base

  ROLES = ["admin", "manage_serv"].freeze

  rolify
  # :confirmable, :lockable, :timeoutable, :omniauthable and :registerable
  devise :database_authenticatable, :trackable, authentication_keys: [:login]

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :username, uniqueness: { case_sensitive: false }, format: { with: /\w+/, message: "Разрешены только английские символы, цифры и знак '_'" }
  validates :password, confirmation: true

  paginates_per 20

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

end
