class ServicePort < ActiveRecord::Base

  belongs_to :service_network

  strip_attributes allow_empty: true, collapse_spaces: true

end
