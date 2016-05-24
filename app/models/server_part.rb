class ServerPart < ActiveRecord::Base

  resourcify

  has_many :template_server_details, dependent: :restrict_with_error
  has_many :server_types, through: :template_server_details

  has_many :real_server_details, dependent: :restrict_with_error
  has_many :servers, through: :real_server_details

  belongs_to :detail_type

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :name, presence: true, uniqueness: { case_sensitive: false }

end
