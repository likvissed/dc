class DetailType < ActiveRecord::Base

  resourcify

  has_many :server_parts, dependent: :restrict_with_error

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :name, presence: true, uniqueness: { case_sensitive: false }

end
