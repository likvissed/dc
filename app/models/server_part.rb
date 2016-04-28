class ServerPart < ActiveRecord::Base

  has_many :template_server_details
  has_many :server_types, through: :template_server_details

  has_many :real_server_details
  has_many :servers, through: :real_server_details

  belongs_to :detail_type

  validates :name, presence: true
end
