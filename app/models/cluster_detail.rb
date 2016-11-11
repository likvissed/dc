class ClusterDetail < ActiveRecord::Base

  resourcify

  belongs_to :cluster
  belongs_to :server
  belongs_to :node_role

  validates :server_id, :node_role_id, presence: true, numericality: { greater_than: 0 }

end
