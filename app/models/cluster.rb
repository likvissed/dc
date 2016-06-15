class Cluster < ActiveRecord::Base

  resourcify

  has_many :cluster_details, dependent: :destroy
  has_many :servers, through: :cluster_details
  has_many :node_roles, through: :cluster_details

  accepts_nested_attributes_for :cluster_details, allow_destroy: true, reject_if: proc { |attr| attr["server_id"].blank? || attr["node_role_id"].blank? }

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :name, uniqueness: { case_sensitive: false }, presence: true

end
