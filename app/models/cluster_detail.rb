class ClusterDetail < ActiveRecord::Base

  resourcify

  belongs_to :clusters
  belongs_to :servers
  belongs_to :node_roles

end
