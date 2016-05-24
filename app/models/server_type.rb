class ServerType < ActiveRecord::Base

  resourcify

  has_many :servers, dependent: :restrict_with_error
  has_many :template_server_details, dependent: :destroy
  has_many :server_parts, through: :template_server_details

  accepts_nested_attributes_for :template_server_details, allow_destroy: true, reject_if: proc { |attr| attr["server_part_id"].blank? }

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :name, presence: true, uniqueness: { case_sensitive: false }

end
