class TemplateServerDetail < ActiveRecord::Base

  resourcify

  belongs_to :server_type
  belongs_to :server_part

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :count, presence: true, numericality: { greater_than: 0 }
  validates :server_part_id, presence: true

end
