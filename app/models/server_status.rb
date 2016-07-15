class ServerStatus < ActiveRecord::Base

  resourcify

  paginates_per 20

  has_many :server_types, dependent: :restrict_with_error

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :name, presence: true, uniqueness: { case_sensitive: false }

end
