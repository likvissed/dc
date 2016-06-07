class NodeRole < ActiveRecord::Base

  resourcify

  has_many :cluster_details

end
