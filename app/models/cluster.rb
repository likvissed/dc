class Cluster < ActiveRecord::Base

  has_many :servers

  strip_attributes allow_empty: true, collapse_spaces: true
  validates :name, uniqueness: { case_sensitive: false }

end
