class Cluster < ActiveRecord::Base

  resourcify

  has_many :cluster_details, dependent: :destroy
  has_many :servers, through: :cluster_details
  has_many :node_roles, through: :cluster_details

  has_many :service_hostings, dependent: :restrict_with_error
  has_many :services, through: :service_hostings

  accepts_nested_attributes_for :cluster_details, allow_destroy: true, reject_if: proc { |attr| attr["server_id"].blank? || attr["node_role_id"].blank? }

  # Empty attributes will not be converted to nil
  # Sequential spaces in attributes will be collapsed to one space
  strip_attributes allow_empty: true, collapse_spaces: true

  validates :name, uniqueness: { case_sensitive: false }, presence: true

end
