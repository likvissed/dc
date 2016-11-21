class RealServerDetail < ActiveRecord::Base

  resourcify

  belongs_to :server
  belongs_to :server_part

  # Empty attributes will not be converted to nil
  # Sequential spaces in attributes will be collapsed to one space
  strip_attributes allow_empty: true, collapse_spaces: true

  validates :count, :server_part_id, presence: true, numericality: { greater_than: 0 }

end
