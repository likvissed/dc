class NodeRole < ActiveRecord::Base

  resourcify

  has_many :cluster_details, dependent: :restrict_with_error
  has_many :clusters, through: :cluster_details

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :name, presence: true, uniqueness: { case_sensitive: false }

end
