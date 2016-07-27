class Netadmin < ActiveRecord::Base

  resourcify

  self.abstract_class = true
  establish_connection "#{Rails.env}_netadmin".to_sym

end
