class AddTestDateToService < ActiveRecord::Migration
  def change
    add_column :services, :deadline, :date, after: :priority
    change_column :services, :dept, :integer, index: true
  end
end
