class NodeRole < ActiveRecord::Base

  resourcify

  has_many :cluster_details, dependent: :restrict_with_error

end
