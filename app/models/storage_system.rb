class StorageSystem < ActiveRecord::Base

  resourcify

  belongs_to :service

  validates :name, presence: true

  strip_attributes allow_empty: false, collapse_spaces: true

end
