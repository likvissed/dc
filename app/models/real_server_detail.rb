class RealServerDetail < ActiveRecord::Base

  belongs_to :server
  belongs_to :server_part

  validates :count, presence: true, numericality: { greater_than: 0 }
  validates :server_part_id, presence: true

end
