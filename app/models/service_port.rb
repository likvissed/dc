class ServicePort < ActiveRecord::Base

  resourcify

  belongs_to :service_network

  strip_attributes allow_empty: true, collapse_spaces: true

end
