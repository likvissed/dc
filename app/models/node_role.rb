class NodeRole < ActiveRecord::Base

  resourcify

  has_many :cluster_details, dependent: :restrict_with_error
  has_many :clusters, through: :cluster_details

  validates :name, presence: true

end
