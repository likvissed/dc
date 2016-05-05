class Server < ActiveRecord::Base

  has_many :real_server_details, dependent: :destroy
  has_many :server_parts, through: :real_server_details

  belongs_to :server_type
  belongs_to :cluster

  accepts_nested_attributes_for :real_server_details, allow_destroy: true, reject_if: proc { |attr| attr["server_part_id"].blank? }

  validates :server_type_id, :name, presence: true

end
