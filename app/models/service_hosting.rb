class ServiceHosting < ActiveRecord::Base

  resourcify

  belongs_to :service
  belongs_to :cluster

  # Empty attributes will not be converted to nil
  # Sequential spaces in attributes will be collapsed to one space
  strip_attributes allow_empty: true, collapse_spaces: true

end
