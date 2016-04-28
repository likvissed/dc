class Server < ActiveRecord::Base

  has_many :real_server_details
  has_many :server_parts, through: :real_server_details

  belongs_to :server_type
  belongs_to :cluster

  accepts_nested_attributes_for :real_server_details

  validates :type_id, presence: true

end
