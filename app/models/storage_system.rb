class StorageSystem < ActiveRecord::Base

  belongs_to :service

  strip_attributes allow_empty: false, collapse_spaces: true

end
