class Cluster < ActiveRecord::Base

  resourcify

  has_many :cluster_details
  has_many :servers, through: :cluster_details

  strip_attributes allow_empty: true, collapse_spaces: true
  validates :name, uniqueness: { case_sensitive: false }

end
