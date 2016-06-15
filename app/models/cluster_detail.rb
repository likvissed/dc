class ClusterDetail < ActiveRecord::Base

  resourcify

  belongs_to :cluster
  belongs_to :server
  belongs_to :node_role

end
