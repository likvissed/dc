class Netadmin < ActiveRecord::Base

  self.abstract_class = true
  establish_connection "#{Rails.env}_netadmin".to_sym

end