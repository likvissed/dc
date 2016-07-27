class ServiceNetwork < ActiveRecord::Base

  has_one :service_port, dependent: :destroy

  belongs_to :service

  strip_attributes allow_empty: true, collapse_spaces: true

  accepts_nested_attributes_for :service_port, allow_destroy: true

end
