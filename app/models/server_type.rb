class ServerType < ActiveRecord::Base

  has_many :servers, dependent: :restrict_with_error
  has_many :template_server_details, dependent: :destroy
  has_many :server_parts, through: :template_server_details

  accepts_nested_attributes_for :template_server_details, allow_destroy: true, reject_if: proc { |attr| attr["server_part_id"].blank? }

  validates :name, presence: true, uniqueness: true

end
