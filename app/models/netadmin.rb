class Netadmin < ActiveRecord::Base

  resourcify

  self.abstract_class = true
  establish_connection :netadmin

end
